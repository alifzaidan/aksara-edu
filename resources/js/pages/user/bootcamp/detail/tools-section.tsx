interface Bootcamp {
    tools?: { name: string; description?: string | null; icon: string | null }[];
}

export default function ToolsSection({ bootcamp }: { bootcamp: Bootcamp }) {
    return (
        <section className="mx-auto mt-2 w-full max-w-5xl px-4 sm:mt-8" id="tools">
            <h2 className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                Tools yang Digunakan
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {bootcamp.tools?.map((tool) => (
                    <div
                        key={tool.name}
                        className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 shadow-md dark:bg-zinc-800"
                    >
                        <img src={tool.icon ? `/storage/${tool.icon}` : '/assets/images/placeholder.png'} alt={tool.name} className="w-16" />
                        <h3 className="text-lg font-semibold md:text-xl">{tool.name}</h3>
                    </div>
                ))}
            </div>
        </section>
    );
}
