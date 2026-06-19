export interface WorkItemResponseDto {
  value: [
    {
      id: number;
      relations: [{ rel: string; url: string }];
    }
  ];
}
