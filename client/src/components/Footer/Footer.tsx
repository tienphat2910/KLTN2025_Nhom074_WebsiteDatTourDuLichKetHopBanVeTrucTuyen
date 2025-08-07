export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-12 px-4">
      <div className="container mx-auto text-center">
        <div className="text-2xl font-bold mb-4">🌎 LuTrip</div>
        <p className="text-slate-400 mb-8">
          Đồng hành cùng bạn khám phá Việt Nam
        </p>
        <div className="flex justify-center space-x-6">
          <a
            href="#"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Facebook
          </a>
          <a
            href="#"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Instagram
          </a>
          <a
            href="#"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
