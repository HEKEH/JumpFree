export type FileLineItem = {
  file: string;
  lineNumber: number;
  line: string;
};

export interface JumpTargetItem {
  file: string; // path of file
  lineNumber: number;
  // line: string;
  tag: string;
}
