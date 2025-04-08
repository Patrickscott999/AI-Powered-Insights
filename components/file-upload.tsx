"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FileUploadProps {
  onUpload: (file: File) => void
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (file) {
      onUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
          isDragging 
            ? "border-blue-500 bg-blue-50 shadow-lg" 
            : file 
              ? "border-green-400 bg-green-50 shadow-md" 
              : "border-gray-300 hover:bg-gray-50"
        } card-hover`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          className="hidden"
        />
        
        <div className="text-center">
          <div className={`mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full ${
            file ? "gradient-success pulse-animation" : "gradient-bg"
          }`}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-8 w-8 ${file ? "text-white" : "text-blue-500"}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={file 
                  ? "M5 13l4 4L19 7" 
                  : "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                } 
              />
            </svg>
          </div>
          
          <h3 className={`text-lg font-medium mb-2 ${file ? "text-green-700" : "text-slate-700"}`}>
            {file ? "File selected" : "Drag & drop your CSV file"}
          </h3>
          
          <p className={`text-sm mb-2 ${file ? "text-green-600" : "text-slate-500"}`}>
            {file 
              ? file.name 
              : "or click to browse files (CSV only)"
            }
          </p>
          
          {file && (
            <div className="mt-3 bg-white bg-opacity-50 rounded-lg px-3 py-2 inline-block">
              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {file.type || "CSV file"}
                </span>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 12a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleUpload} 
          disabled={!file}
          className={`w-full sm:w-auto transition-all duration-300 ${
            file 
              ? "gradient-primary hover:opacity-90 hover:shadow-md"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {file ? "Process File" : "Select a File First"}
        </Button>
      </div>
    </div>
  )
}
