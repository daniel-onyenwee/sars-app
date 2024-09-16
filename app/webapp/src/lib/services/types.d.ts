
export interface Pagination {
    page?: number
    count?: number | "all"
}

export interface SortByOption {
    ascending?: boolean
}

type ServiceHandle<ServiceBody, ServiceReturnedData> = ServiceBody extends null ?
    ({ fetchApi }: { fetchApi?: typeof fetch }) => Promise<ServiceData<ServiceReturnedData>> :
    (data: ServiceBody & { fetchApi?: typeof fetch }) => Promise<ServiceData<ServiceReturnedData>>

type AuthenticatedServiceHandle<ServiceBody, ServiceReturnedData> = ServiceBody extends null ?
    ({ accessToken, fetchApi }: { accessToken: string, fetchApi?: typeof fetch }) => Promise<ServiceData<ServiceReturnedData>> :
    (data: ServiceBody & { accessToken: string, fetchApi?: typeof fetch }) => Promise<ServiceData<ServiceReturnedData>>

interface ServiceError {
    code: number
    message: string
}

export interface ServiceData<T> {
    ok: boolean
    error: ServiceError | null
    data: T | null
}

type LevelNumber = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000

export type Level = `L_${LevelNumber}`

export type Semester = "FIRST" | "SECOND"

export type Gender = "MALE" | "FEMALE"