package com.mcplibrary.infrastructure.persistence

import com.mcplibrary.domain.search.KeywordSearchPort
import com.mcplibrary.domain.usecase.UseCase
import org.springframework.stereotype.Component

@Component
class KeywordSearchAdapter(
    private val useCaseRepository: UseCaseJpaRepositoryAdapter,
) : KeywordSearchPort {

    override fun search(query: String, limit: Int): List<UseCase> {
        val baseTerms = splitTerms(query)
        if (baseTerms.isEmpty()) return emptyList()

        // 단어 개수의 절반 이상이 매칭돼야 반환 (올림)
        val minMatched = (baseTerms.size + 1) / 2

        return useCaseRepository.findAll()
            .map { uc ->
                val corpus = buildCorpus(uc)
                val matched = baseTerms.count { termMatches(corpus, it) }
                uc to matched
            }
            .filter { (_, matched) -> matched >= minMatched }
            .sortedByDescending { (_, matched) -> matched }
            .take(limit)
            .map { (uc, _) -> uc }
    }

    /** 쿼리를 공백/구두점으로 분리한 순수 단어 목록 */
    private fun splitTerms(text: String): List<String> =
        text.lowercase()
            .split(Regex("[\\s,.?!]+"))
            .filter { it.length >= 2 }
            .distinct()

    /**
     * 정확한 단어 포함 여부를 검사하며, 3자 이상 검색어는 마지막 1자를 뗀 형태도 허용.
     * "주문취소" → corpus에 "주문취소" 또는 "주문취" 포함 시 매칭.
     * 기존 2자 prefix 방식은 "주문취소" 검색 시 "주문"만 있는 항목도 히트해 결과가 너무 넓었음.
     */
    private fun termMatches(corpus: String, term: String): Boolean =
        corpus.contains(term) ||
        (term.length >= 3 && corpus.contains(term.dropLast(1)))

    private fun buildCorpus(uc: UseCase): String = buildString {
        append(uc.domain.value); append(" ")
        append(uc.title.value); append(" ")
        uc.scenarios().items().forEach { append(it.description); append(" ") }
        uc.rules().items().forEach { append(it.description); append(" "); append(it.constraint); append(" ") }
        uc.exceptions().items().forEach { append(it.condition); append(" "); append(it.handling); append(" ") }
    }.lowercase()
}
