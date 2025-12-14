
interface LocalLLMOptions {
  url: string;
  model: string;
  temperature?: number;
}

export async function callLocalLLM(
  messages: Array<{ role: string; content: string }>,
  options: LocalLLMOptions,
  onChunk?: (chunk: string) => void
): Promise<any> {
    const { url, model, temperature } = options;
    const storedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('MTZ_LOCAL_LLM_URL') : null;
    const finalUrl = storedUrl || url;
    const isStreaming = !!onChunk;

    try {
        console.log('[LocalLLM] Sending request to:', finalUrl);
        console.log('[LocalLLM] Model:', model, 'Streaming:', isStreaming);
        
        const response = await fetch(`${finalUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer lm-studio` 
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: temperature || 0.7,
                stream: isStreaming
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Local LLM Error (${response.status}): ${errorText}`);
        }

        if (isStreaming && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const content = data.choices?.[0]?.delta?.content || "";
                            if (content) {
                                fullContent += content;
                                onChunk(content);
                            }
                        } catch (e) {
                            console.warn('Error parsing stream chunk:', e);
                        }
                    }
                }
            }
            // Return pseudo-response format for compatibility
            return { choices: [{ message: { content: fullContent } }] };
        } else {
            const data = await response.json();
            return data;
        }

    } catch (error) {
        console.error('[LocalLLM] Fetch error:', error);
        throw error;
    }
}
