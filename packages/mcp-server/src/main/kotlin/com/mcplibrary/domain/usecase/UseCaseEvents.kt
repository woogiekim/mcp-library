package com.mcplibrary.domain.usecase

import java.time.Instant

sealed interface UseCaseEvent {
    val occurredAt: Instant get() = Instant.now()
}

data class UseCaseCreated(val useCaseId: UseCaseId) : UseCaseEvent
data class UseCaseUpdated(val useCaseId: UseCaseId) : UseCaseEvent
data class UseCaseDeleted(val useCaseId: UseCaseId) : UseCaseEvent
