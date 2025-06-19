export default function ToolsSection() {
    return (
        <section className="mx-auto mt-8 w-full max-w-5xl px-4" id="tools">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">Tools Pendukung</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-laravel.svg" alt="Laravel" />
                    <h3 className="text-lg font-semibold md:text-xl dark:text-gray-900">Laravel</h3>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-reactjs.svg" alt="React JS" />
                    <h3 className="text-lg font-semibold md:text-xl dark:text-gray-900">React JS</h3>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-vue.svg" alt="Vue" />
                    <h3 className="text-lg font-semibold md:text-xl dark:text-gray-900">Vue.js</h3>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-figma.svg" alt="Figma" />
                    <h3 className="text-lg font-semibold md:text-xl dark:text-gray-900">Figma</h3>
                </div>
            </div>
        </section>
    );
}
