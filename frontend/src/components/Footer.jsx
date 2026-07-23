import { Link } from "react-router-dom";
import { Instagram, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="bg-[#1A1C19] text-stone-300 mt-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl text-white">Casa</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400">Connect</span>
          </div>
          <p className="font-serif italic text-2xl text-stone-200 mt-6 leading-snug max-w-md">
            Homes are not products. They are the quiet architecture of a life.
          </p>
          <div className="flex gap-4 mt-8">
            <a href="#" aria-label="Instagram" className="w-10 h-10 border border-stone-700 flex items-center justify-center hover:border-[#C86A53] hover:text-[#C86A53] transition">
              <Instagram className="w-4 h-4" strokeWidth={1.5} />
            </a>
            <a href="#" aria-label="Twitter" className="w-10 h-10 border border-stone-700 flex items-center justify-center hover:border-[#C86A53] hover:text-[#C86A53] transition">
              <Twitter className="w-4 h-4" strokeWidth={1.5} />
            </a>
            <a href="#" aria-label="LinkedIn" className="w-10 h-10 border border-stone-700 flex items-center justify-center hover:border-[#C86A53] hover:text-[#C86A53] transition">
              <Linkedin className="w-4 h-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-5">Explore</div>
          <ul className="space-y-3 text-sm">
            <li><Link className="hover:text-white" to="/listings">All Listings</Link></li>
            <li><Link className="hover:text-white" to="/listings?listing_type=sale">For Sale</Link></li>
            <li><Link className="hover:text-white" to="/listings?listing_type=rent">Rentals</Link></li>
            <li><Link className="hover:text-white" to="/listings?featured=true">Featured</Link></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-5">Studio</div>
          <p className="text-sm text-stone-400 leading-relaxed">
            34 Coastal Ridge Ave, Suite 12<br />
            Malibu, California 90265<br />
            hello@casaconnect.co · +1 (415) 555-0142
          </p>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between text-xs text-stone-500 gap-2">
          <span>© {new Date().getFullYear()} Casa Connect. All rights reserved.</span>
          <span>Crafted with intention.</span>
        </div>
      </div>
    </footer>
  );
}
