package com.mcplibrary.infrastructure.llm

import com.anthropic.client.AnthropicClient
import com.anthropic.client.okhttp.AnthropicOkHttpClient
import com.anthropic.models.CacheControlEphemeral
import com.anthropic.models.MessageCreateParams
import com.anthropic.models.Model
import com.anthropic.models.TextBlock
import com.anthropic.models.TextBlockParam
import com.mcplibrary.domain.llm.LlmPort
import com.mcplibrary.domain.llm.LlmRequest
import com.mcplibrary.domain.llm.LlmResponse

class AnthropicLlmAdapter(
    apiKey: String,
    private val model: String = Model.CLAUDE_HAIKU_4_5.toString(),
) : LlmPort {

    private val client: AnthropicClient by lazy {
        AnthropicOkHttpClient.builder().apiKey(apiKey).build()
    }

    override fun complete(request: LlmRequest): LlmResponse {
        val params = MessageCreateParams.builder()
            .model(model)
            .maxTokens(request.maxTokens.toLong())
            .system(listOf(
                TextBlockParam.builder()
                    .text(request.systemPrompt)
                    .cacheControl(CacheControlEphemeral.builder().build())
                    .build()
            ))
            .addUserMessage(request.userMessage)
            .build()

        val message = client.messages().create(params)
        val content = message.content().filterIsInstance<TextBlock>()
            .joinToString("") { it.text() }

        return LlmResponse(content = content, provider = "anthropic/$model")
    }
}
