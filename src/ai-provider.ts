export interface AIProvider {
  answer(question: string): Promise<string>;
}
