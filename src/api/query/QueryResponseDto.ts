export interface QueryResponseDto {
    payload: {
        columns: string[];
        rows: (string | number)[][];
    };
    sourceIds: number[];
}
