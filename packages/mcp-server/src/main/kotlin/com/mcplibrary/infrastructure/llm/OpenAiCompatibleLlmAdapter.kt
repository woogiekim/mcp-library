package com.mcplibrary.infrastructure.llm

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import com.mcplibrary.domain.llm.LlmPort
import com.mcplibrary.domain.llm.LlmRequest
import com.mcplibrary.domain.llm.LlmResponse
import org.springframework.web.client.RestClient

/**
 * OpenAI Chat Completions API 호환 어댑터.
 * Ollama, OpenAI, Groq, LM Studio 등 동일 인터페이스를 사용하는 모든 provider에 적용 가능.
 *
 * Ollama:  baseUrl = "http://localhost:11434/v1", apiKey = "ollama"
 * OpenAI:  baseUrl = "https://api.openai.com/v1", apiKey = sk-...
 * Groq:    baseUrl = "https://api.groq.com/openai/v1", apiKey = gsk_...
 */
class OpenAiCompatibleLlmAdapter(
    private val baseUrl: String,
    private val apiKey: String,
    private val model: String,
) : LlmPort {

    private val restClient: RestClient by lazy {
        RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("Authorization", "Bearer $apiKey")
            .defaultHeader("Content-Type", "application/json")
            .build()
    }

    override fun complete(request: LlmRequest): LlmResponse {
        val body = ChatRequest(
            model = model,
            messages = listOf(
                ChatMessage(role = "system", content = request.systemPrompt),
                ChatMessage(role = "user", content = request.userMessage),
            ),
            maxTokens = request.maxTokens,
        )

        val response = restClient.post()
            .uri("/chat/completions")
            .body(body)
            .retrieve()
            .body(ChatResponse::class.java)
            ?: throw IllegalStateException("LLM 응답이 비어있습니다")

        val content = response.choices.firstOrNull()?.message?.content
            ?: throw IllegalStateException("LLM 응답에 content가 없습니다")

        return LlmResponse(content = content, provider = "$baseUrl/$model")
    }

    private data class ChatRequest(
        val model: String,
        val messages: List<ChatMessage>,
        @JsonProperty("max_tokens") val maxTokens: Int,
    )

    private data class ChatMessage(
        val role: String,
        val content: String,
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    private data class ChatResponse(
        val choices: List<Choice> = emptyList(),
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    private data class Choice(
        val message: ChatMessage = ChatMessage("", ""),
    )
}
