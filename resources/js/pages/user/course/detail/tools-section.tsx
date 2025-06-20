interface Course {
    tools?: { name: string; description?: string | null; icon: string | null }[];
}

export default function ToolsSection({ course }: { course: Course }) {
    return (
        <section className="mx-auto mt-8 w-full max-w-5xl px-4" id="tools">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">Tools Pendukung</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {course.tools?.map((tool) => (
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
