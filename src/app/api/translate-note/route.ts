import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is missing in environment variables' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text } = await req.json()

  if (!text?.trim()) {
    return NextResponse.json({ translated: text ?? '' })
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: 'Translate the following Turkish text to natural English. Return ONLY the translated text, no explanations or quotation marks.'
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.3,
      }
    })

    const translated = result.response.text().trim()

    return NextResponse.json({ translated: translated || text })
  } catch {
    return NextResponse.json({ translated: text })
  }
}
