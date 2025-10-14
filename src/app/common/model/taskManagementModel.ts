export interface TaskManagement {
  id: number;
  name: string; // Chnaging this from buName to name, as the backend providing this var
}

// Interface for dropdown options
export interface DropDownOptions {
  label: string;
  value: number;
}