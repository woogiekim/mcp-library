package com.mcplibrary.infrastructure.llm

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import com.mcplibrary.domain.llm.LlmPort
import com.mcplibrary.domain.llm.LlmRequest
import com.mcplibrary.domain.llm.LlmResponse
import org.springframework.web.client.RestClient

/**
 * Anthropic Messages API를 HTTP로 직접 호출.
 * SDK 버전 의존 없이 동작하며, prompt caching (cache_control: ephemeral) 적용.
 */
class AnthropicLlmAdapter(
    private val apiKey: String,
    private val model: String = "claude-haiku-4-5-20251001",
) : LlmPort {

    private val restClient: RestClient by lazy {
        HttpClientFactory.restClient(
            "https://api.anthropic.com/v1",
            "x-api-key" to apiKey,
            "anthropic-version" to "2023-06-01",
            "anthropic-beta" to "prompt-caching-2024-07-31",
            "Content-Type" to "application/json",
        )
    }

    override fun complete(request: LlmRequest): LlmResponse {
        val body = AnthropicRequest(
            model = model,
            maxTokens = request.maxTokens,
            system = listOf(
                SystemBlock(
                    text = request.systemPrompt,
                    cacheControl = CacheControl(type = "ephemeral"),
                )
            ),
            messages = listOf(Message(role = "user", content = request.userMessage)),
        )

        val response = restClient.post()
            .uri("/messages")
            .body(body)
            .retrieve()
            .body(AnthropicResponse::class.java)
            ?: throw IllegalStateException("Anthropic API 응답이 비어있습니다")

        val content = response.content.firstOrNull()?.text
            ?: throw IllegalStateException("Anthropic API 응답에 content가 없습니다")

        return LlmResponse(content = content, provider = "anthropic/$model")
    }

    private data class AnthropicRequest(
        val model: String,
        @JsonProperty("max_tokens") val maxTokens: Int,
        val system: List<SystemBlock>,
        val messages: List<Message>,
    )

    private data class SystemBlock(
        val type: String = "text",
        val text: String,
        @JsonProperty("cache_control") val cacheControl: CacheControl? = null,
    )

    private data class CacheControl(val type: String)

    private data class Message(val role: String, val content: String)

    @JsonIgnoreProperties(ignoreUnknown = true)
    private data class AnthropicResponse(
        val content: List<ContentBlock> = emptyList(),
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    private data class ContentBlock(
        val type: String = "text",
        val text: String = "",
    )
}
