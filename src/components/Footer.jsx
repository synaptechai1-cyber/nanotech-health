import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="NanoTech Health" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
            <span className="font-bold text-gray-800">NanoTech Health</span>
          </div>
          <p className="text-xs text-gray-400 text-center max-w-md">
            NanoTech Health is a communication platform for licensed healthcare providers. We do not sell medication, set prices, or automate clinical decisions.
          </p>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} NanoTech Health</p>
        </div>
      </div>
    </footer>
  )
}
