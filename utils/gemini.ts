import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBcxiBGk-Jj3XF2qrUCdkz4qEeTfvjYaTU';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ParsedExpense {
  name: string;
  category: string;
  amount: number;
}

export async function parseExpenseText(input: string, availableCategories: string[]): Promise<ParsedExpense | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const categoriesStr = availableCategories.join(', ');
    
    const prompt = `Parse this expense text into JSON format.

Text: "${input}"

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"name": "item name", "category": "category", "amount": number}

Available categories: ${categoriesStr}

Examples:
Input: "Nasi goreng 15rb" → {"name":"Nasi Goreng","category":"Makan","amount":15000}
Input: "Bensin 50ribu" → {"name":"Bensin","category":"Transport","amount":50000}
Input: "Kopi 12k" → {"name":"Kopi","category":"Makan","amount":12000}

IMPORTANT: Use ONLY categories from the available list above.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini response:', text);
    
    // Try to extract JSON - be more lenient
    let jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      // Try to find JSON with nested objects
      jsonMatch = text.match(/\{[\s\S]*?\}/);
    }
    
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('Tidak bisa menemukan data JSON dari response');
    }

    const parsed: ParsedExpense = JSON.parse(jsonMatch[0]);
    
    // Validate
    if (!parsed.name || !parsed.amount || parsed.amount <= 0) {
      throw new Error('Data tidak lengkap atau invalid');
    }

    // Normalize category - check if it exists in available categories
    if (!availableCategories.includes(parsed.category)) {
      // Try to find closest match (case insensitive)
      const matchedCategory = availableCategories.find(c => 
        c.toLowerCase() === parsed.category.toLowerCase()
      );
      if (matchedCategory) {
        parsed.category = matchedCategory;
      } else {
        // Use first category as fallback
        parsed.category = availableCategories[0] || 'Lainnya';
      }
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing expense text:', error);
    return null;
  }
}

export async function parseExpenseImage(imageUri: string, availableCategories: string[], splitItems: boolean = true): Promise<ParsedExpense[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Read image as base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        resolve(base64.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });

    const categoriesStr = availableCategories.join(', ');

    const prompt = splitItems 
      ? `Kamu adalah asisten untuk aplikasi pencatat pengeluaran. Analisis gambar struk/nota/kwitansi ini dan extract SEMUA item pengeluaran.

Parse menjadi JSON ARRAY dengan format: [
  { "name": "nama item", "category": "kategori", "amount": angka },
  { "name": "nama item 2", "category": "kategori", "amount": angka }
]

Kategori yang tersedia: ${categoriesStr}

Rules:
- Extract SETIAP ITEM dengan harga masing-masing
- Jangan gabungkan item berbeda
- amount = harga per item (bukan total)
- Gunakan kategori yang paling sesuai untuk SETIAP item
- Jika hanya ada 1 item atau total, return array dengan 1 item saja

Contoh:
Struk dengan "Nasi Goreng Rp 15.000, Es Teh Rp 5.000" →
[{"name":"Nasi Goreng","category":"Makanan & Minuman","amount":15000}, {"name":"Es Teh","category":"Makanan & Minuman","amount":5000}]

PENTING: Return JSON array saja, tanpa penjelasan.`
      : `Kamu adalah asisten untuk aplikasi pencatat pengeluaran. Analisis gambar struk/nota/kwitansi ini dan extract informasi pengeluaran.

Parse menjadi JSON dengan format: { "name": "nama item/merchant", "category": "kategori", "amount": total_amount_angka }

Kategori yang tersedia: ${categoriesStr}

Rules:
- Ambil TOTAL amount (bukan subtotal)
- Jika ada multiple items, ambil yang paling dominan atau merchant name
- amount harus angka tanpa format (contoh: 15000, bukan "15.000" atau "15k")
- Gunakan kategori yang paling sesuai dari list yang tersedia

PENTING: Hanya return JSON saja, tanpa penjelasan tambahan.`;

    const imagePart = {
      inlineData: {
        data: base64data,
        mimeType: 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    console.log('Gemini OCR response:', text);
    
    // Try to extract JSON
    let jsonMatch = text.match(/\[[\s\S]*?\]/); // Try array first
    if (!jsonMatch && !splitItems) {
      jsonMatch = text.match(/\{[^}]+\}/); // Fallback to single object
    }
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    let parsedData = JSON.parse(jsonMatch[0]);
    
    // Ensure it's always an array
    const expenses: ParsedExpense[] = Array.isArray(parsedData) ? parsedData : [parsedData];
    
    // Validate and normalize each expense
    // Validate and normalize each expense
    const validExpenses = expenses
      .filter(exp => exp.name && exp.amount && exp.amount > 0)
      .map(exp => {
        // Normalize category
        if (!availableCategories.includes(exp.category)) {
          const matchedCategory = availableCategories.find(c => 
            c.toLowerCase() === exp.category.toLowerCase()
          );
          exp.category = matchedCategory || availableCategories[0] || 'Lainnya';
        }
        return exp;
      });

    // Group items with same name
    // Group items with same name
    const expenseMap = new Map<string, ParsedExpense>();
    const countMap = new Map<string, number>();

    validExpenses.forEach(exp => {
      const normalizedName = exp.name.trim().toLowerCase();
      
      if (expenseMap.has(normalizedName)) {
        // Merge with existing item
        const existing = expenseMap.get(normalizedName)!;
        existing.amount += exp.amount;
        
        // Increment count
        const currentCount = countMap.get(normalizedName) || 1;
        countMap.set(normalizedName, currentCount + 1);
      } else {
        // Add new item - Ensure name is pretty (Title Case if needed)
        // Simple distinct logic: If name is ALL CAPS or all lower, title case it.
        let prettyName = exp.name.trim();
        if (prettyName === prettyName.toUpperCase() || prettyName === prettyName.toLowerCase()) {
           prettyName = prettyName.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
        }
        
        expenseMap.set(normalizedName, { ...exp, name: prettyName });
        countMap.set(normalizedName, 1);
      }
    });

    // Convert back to array and append count if > 1
    return Array.from(expenseMap.entries()).map(([key, value]) => {
      const count = countMap.get(key) || 1;
      if (count > 1) {
        return {
          ...value,
          name: `${value.name} (x${count})`
        };
      }
      return value;
    });
  } catch (error) {
    console.error('Error parsing expense image:', error);
    return null;
  }
}
