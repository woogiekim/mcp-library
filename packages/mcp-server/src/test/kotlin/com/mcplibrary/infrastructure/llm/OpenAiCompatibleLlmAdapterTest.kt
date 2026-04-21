package com.mcplibrary.infrastructure.llm

import com.mcplibrary.domain.llm.LlmRequest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class OpenAiCompatibleLlmAdapterTest {

    @Test
    fun `잘못된 baseUrl이면 complete 호출 시 예외가 발생한다`() {
        val adapter = OpenAiCompatibleLlmAdapter(
            baseUrl = "http://127.0.0.1:0/v1",
            apiKey = "test",
            model = "llama3.1",
        )
        assertThrows<Exception> {
            adapter.complete(LlmRequest(systemPrompt = "system", userMessage = "hello"))
        }
    }
}
