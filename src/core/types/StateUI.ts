

export type StateReturnStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'READY_TO_FILE' | 'FILED'

export interface StateReturnMetadata {
    state: string
    status: StateReturnStatus
    lastModified: string // ISO date
    residencyStatus: 'RESIDENT' | 'PART_YEAR' | 'NON_RESIDENT'
    // For part-year residents
    residencyStartDate?: string
    residencyEndDate?: string
    // Tracking progress steps
    stepsCompleted: {
        residency: boolean
        incomeAllocation: boolean
        questions: boolean
        review: boolean
    }
    // Allocations: Record<SourceKey, Amount>
    // SourceKey example: 'w2-0', '1099-0'
    allocations?: Record<string, number>
}

export interface StateUIState {
    stateReturns: Record<string, StateReturnMetadata>
    activeStateCode?: string
}
