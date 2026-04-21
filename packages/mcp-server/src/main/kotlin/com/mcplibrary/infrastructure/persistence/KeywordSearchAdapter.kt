package com.mcplibrary.infrastructure.persistence

import com.mcplibrary.domain.search.KeywordSearchPort
import com.mcplibrary.domain.usecase.UseCase
import org.springframework.stereotype.Component

@Component
class KeywordSearchAdapter(
    private val useCaseRepository: UseCaseJpaRepositoryAdapter,
) : KeywordSearchPort {
    override fun search(query: String, limit: Int): List<UseCase> {
        val terms = query.lowercase().split(" ").filter { it.isNotBlank() }
        return useCaseRepository.findAll()
            .filter { uc ->
                val text = "${uc.domain.value} ${uc.title.value}".lowercase()
                terms.any { text.contains(it) }
            }
            .take(limit)
    }
}
