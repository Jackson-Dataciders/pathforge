export class ContentError extends Error {
  readonly file: string;
  readonly messages: string[];

  constructor(file: string, messages: string[]) {
    super(messages.map((message) => `${file}: ${message}`).join("\n"));
    this.name = "ContentError";
    this.file = file;
    this.messages = messages;
  }
}