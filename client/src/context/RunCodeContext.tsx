import axiosInstance from "@/api/"
import { Language, RunContext as RunContextType } from "@/types/run"
import langMap from "lang-map"
import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react"
import toast from "react-hot-toast"
import { useFileSystem } from "./FileContext"

// Fallback languages in case Piston API is unavailable
const FALLBACK_LANGUAGES: Language[] = [
    { language: "javascript", version: "18.15.0", aliases: ["js", "javascript"] },
    { language: "typescript", version: "5.0.3", aliases: ["ts", "typescript"] },
    { language: "python", version: "3.10.0", aliases: ["py", "python"] },
    { language: "java", version: "15.0.2", aliases: ["java"] },
    { language: "cpp", version: "10.2.0", aliases: ["cpp", "c++"] },
    { language: "c", version: "10.2.0", aliases: ["c"] },
    { language: "csharp", version: "6.12.0", aliases: ["cs", "csharp"] },
    { language: "go", version: "1.16.2", aliases: ["go", "golang"] },
    { language: "rust", version: "1.68.2", aliases: ["rs", "rust"] },
    { language: "ruby", version: "3.0.1", aliases: ["rb", "ruby"] },
    { language: "php", version: "8.2.3", aliases: ["php"] },
    { language: "swift", version: "5.3.3", aliases: ["swift"] },
    { language: "kotlin", version: "1.8.20", aliases: ["kt", "kotlin"] },
    { language: "typescript", version: "5.0.3", aliases: ["ts"] },
]

const RunCodeContext = createContext<RunContextType | null>(null)

export const useRunCode = () => {
    const context = useContext(RunCodeContext)
    if (context === null) {
        throw new Error(
            "useRunCode must be used within a RunCodeContextProvider",
        )
    }
    return context
}

const RunCodeContextProvider = ({ children }: { children: ReactNode }) => {
    const { activeFile } = useFileSystem()
    const [input, setInput] = useState<string>("")
    const [output, setOutput] = useState<string>("")
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([])
    const [selectedLanguage, setSelectedLanguage] = useState<Language>({
        language: "",
        version: "",
        aliases: [],
    })

    useEffect(() => {
        const fetchSupportedLanguages = async () => {
            try {
                const languages = await axiosInstance.get("/runtimes")
                setSupportedLanguages(languages.data)
            } catch (error: any) {
                console.warn("Piston API unavailable, using fallback languages")
                setSupportedLanguages(FALLBACK_LANGUAGES)
            }
        }

        fetchSupportedLanguages()
    }, [])

    // Set the selected language based on the file extension
    useEffect(() => {
        if (supportedLanguages.length === 0 || !activeFile?.name) return

        const extension = activeFile.name.split(".").pop()
        if (extension) {
            const languageName = langMap.languages(extension)
            const language = supportedLanguages.find(
                (lang) =>
                    lang.aliases.includes(extension) ||
                    languageName.includes(lang.language.toLowerCase()),
            )
            if (language) setSelectedLanguage(language)
        } else setSelectedLanguage({ language: "", version: "", aliases: [] })
    }, [activeFile?.name, supportedLanguages])

    const runCode = async () => {
        try {
            if (!selectedLanguage) {
                return toast.error("Please select a language to run the code")
            } else if (!activeFile) {
                return toast.error("Please open a file to run the code")
            } else {
                toast.loading("Running code...")
            }

            setIsRunning(true)
            const { language, version } = selectedLanguage

            const response = await axiosInstance.post("/execute", {
                language,
                version,
                files: [{ name: activeFile.name, content: activeFile.content }],
                stdin: input,
            })
            if (response.data.run.stderr) {
                setOutput(response.data.run.stderr)
            } else {
                setOutput(response.data.run.stdout)
            }
            setIsRunning(false)
            toast.dismiss()
        } catch (error: any) {
            console.error(error.response?.data || error)
            setIsRunning(false)
            toast.dismiss()
            // Show helpful message for code execution errors
            if (error.code === 'ERR_NETWORK' || error.message.includes('Network')) {
                toast.error("Code execution service unavailable. Check your connection.")
            } else {
                toast.error("Failed to run the code")
            }
        }
    }

    return (
        <RunCodeContext.Provider
            value={{
                setInput,
                output,
                isRunning,
                supportedLanguages,
                selectedLanguage,
                setSelectedLanguage,
                runCode,
            }}
        >
            {children}
        </RunCodeContext.Provider>
    )
}

export { RunCodeContextProvider }
export default RunCodeContext
