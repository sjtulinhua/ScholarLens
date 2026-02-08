"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Model List based on verified availability
const MODELS = [
  { value: "gemini-3-flash-preview", label: "Gemini 3.0 Flash (Preview) ⚡" },
  { value: "gemini-3-pro-preview", label: "Gemini 3.0 Pro (Preview) 🧠" },
  { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (Exp)" },
  { value: "gemini-2.0-pro-exp", label: "Gemini 2.0 Pro (Exp)" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Stable)" },
  { value: "qwen-vl-max", label: "Qwen VL Max (China) 🇨🇳" },
  { value: "qwen-vl-plus", label: "Qwen VL Plus (China) 🇨🇳" },
]

export function ModelSelector() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("gemini-2.0-flash-exp")

  useEffect(() => {
    const saved = localStorage.getItem("scholar_lens_model")
    if (saved) {
        // Verify if saved model is still in our list or valid
        setValue(saved)
    }
    // Also set a cookie for server actions to read
    document.cookie = `scholar_lens_model=${saved || "gemini-2.0-flash-exp"}; path=/; max-age=31536000`
  }, [])

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)
    setOpen(false)
    localStorage.setItem("scholar_lens_model", currentValue)
    document.cookie = `scholar_lens_model=${currentValue}; path=/; max-age=31536000`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 bg-white border-zinc-200"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-500" />
            {value
              ? MODELS.find((framework) => framework.value === value)?.label || value
              : "Select AI Model..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-white" align="start">
        <Command>
          <CommandInput placeholder="Search model..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {MODELS.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === framework.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {framework.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
