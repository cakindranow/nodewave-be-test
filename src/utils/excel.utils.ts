import XLSX from "xlsx";

export const parseExcel = (filePath: string) => {
  const excelFile = XLSX.readFile(filePath);
  const sheetName = excelFile.SheetNames[0];
  const sheet = excelFile.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
};
