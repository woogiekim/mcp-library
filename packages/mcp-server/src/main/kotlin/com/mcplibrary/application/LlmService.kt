package com.mcplibrary.application

import com.anthropic.client.AnthropicClient
import com.anthropic.client.okhttp.AnthropicOkHttpClient
import com.anthropic.models.MessageCreateParams
import com.anthropic.models.Model
import com.anthropic.models.TextBlockParam
import com.anthropic.models.CacheControlEphemeral
import com.mcplibrary.domain.usecase.UseCase
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class LlmService(
    @Value("\${anthropic.api-key}") private val apiKey: String,
) {
    private val client: AnthropicClient by lazy {
        AnthropicOkHttpClient.builder().apiKey(apiKey).build()
    }

    fun answer(query: String, relevantUseCases: List<UseCase>): String {
        val systemPrompt = buildSystemPrompt(relevantUseCases)
        val params = MessageCreateParams.builder()
            .model(Model.CLAUDE_SONNET_4_5)
            .maxTokens(2048)
            .system(listOf(
                TextBlockParam.builder()
                    .text(systemPrompt)
                    .cacheControl(CacheControlEphemeral.builder().build())
                    .build()
            ))
            .addUserMessage(query)
            .build()

        val message = client.messages().create(params)
        return message.content().filterIsInstance<com.anthropic.models.TextBlock>()
            .joinToString("") { it.text() }
    }

    private fun buildSystemPrompt(useCases: List<UseCase>): String {
        val context = useCases.joinToString("\n\n") { it.buildContextText() }
        return """
당신은 소프트웨어 개발팀의 도메인 전문가 어시스턴트입니다.
반드시 아래 UseCase 정의에 기반하여 답변하세요.
UseCase에 정의되지 않은 내용은 추측하지 말고, "정의된 UseCase에 해당 내용이 없습니다"라고 답하세요.

--- UseCase Context ---
$context
--- End Context ---

답변 형식:
1. 관련 정책/규칙 요약
2. 단계별 가이드 (해당 시)
3. 주의사항 (예외 케이스)
        """.trimIndent()
    }
}
