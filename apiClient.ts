import { apiRequest } from "./queryClient";

interface FileUploadResponse {
  url: string;
  [key: string]: any;
}

/**
 * Upload a file to the server
 * @param file The file to upload
 * @param endpoint The API endpoint to upload to
 * @param formFieldName The name of the form field for the file
 * @param additionalData Additional form data to include
 * @returns Promise with the response data
 */
export async function uploadFile<T = FileUploadResponse>(
  file: File,
  endpoint: string,
  formFieldName: string = 'file',
  additionalData?: Record<string, string>
): Promise<T> {
  const formData = new FormData();
  formData.append(formFieldName, file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  const response = await apiRequest('POST', endpoint, undefined, formData);
  return await response.json() as T;
}

/**
 * Upload multiple files to the server
 * @param files Array of files to upload
 * @param endpoint The API endpoint to upload to
 * @param formFieldName The name of the form field for the files
 * @param additionalData Additional form data to include
 * @returns Promise with the response data
 */
export async function uploadMultipleFiles<T = FileUploadResponse[]>(
  files: File[],
  endpoint: string,
  formFieldName: string = 'files',
  additionalData?: Record<string, string>
): Promise<T> {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append(formFieldName, file);
  });
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  const response = await apiRequest('POST', endpoint, undefined, formData);
  return await response.json() as T;
}
