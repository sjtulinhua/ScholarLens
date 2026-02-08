import { describe, it, expect } from 'vitest'
import { analyzeImageWithGemini } from '@/lib/ai/gemini'

describe('Gemini AI Service (Mock Mode)', () => {
  it('should return mocked data when MOCK_AI=true', async () => {
    // Set env var
    process.env.MOCK_AI = 'true'
    
    // Mock image input
    const mockImages = [{ 
      buffer: Buffer.from('fake-image'), 
      mimeType: 'image/jpeg' 
    }]
    
    // Call service
    const start = Date.now()
    const result = await analyzeImageWithGemini(mockImages, 'fake prompt')
    const duration = Date.now() - start
    
    // Verify result structure (matches fixture)
    expect(result).toBeInstanceOf(Array)
    expect(result[0]).toHaveProperty('content')
    expect(result[0]).toHaveProperty('is_mistake', true)
    // Check if it's the specific fixture data
    expect(result[0].content).toContain('重庆') 
    
    // Verify duration (should be > 1.5s due to simulated delay)
    expect(duration).toBeGreaterThan(1500)
    
    console.log('Mock AI Response:', result[0].error_analysis.slice(0, 50) + '...')
  })
})
