export interface WorkItemRequestDto {
    $expand: string;
    fields: string[];
    ids: number[];
}
