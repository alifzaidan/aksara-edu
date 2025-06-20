import { InfiniteSlider } from '@/components/ui/infinite-slider';

interface Tool {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export default function ToolsSection({ tools }: { tools: Tool[] }) {
    return (
        <section className="w-fullpx-4 py-8">
            <p className="text-primary border-primary bg-background mx-auto mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                Tools & Framework
            </p>
            <h2 className="dark:text-primary-foreground mx-auto mb-8 max-w-2xl text-center text-3xl font-bold italic md:text-4xl">
                Tools up-to-date yang digunakan
            </h2>
            <InfiniteSlider speedOnHover={20} gap={24} className="p-4">
                {tools.map((tool) => (
                    <div key={tool.id} className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 shadow-md">
                        <img src={tool.icon ? `/storage/${tool.icon}` : '/assets/images/placeholder.png'} alt={tool.name} className="h-12" />
                        <div className="md:space-y-2">
                            <h3 className="text-xl font-semibold md:text-2xl dark:text-gray-900">{tool.name}</h3>
                            <p className="text-sm text-gray-500">{tool.description}</p>
                        </div>
                    </div>
                ))}
            </InfiniteSlider>
            <InfiniteSlider speedOnHover={20} gap={24} className="p-4" reverse>
                {tools.map((tool) => (
                    <div key={tool.id} className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 shadow-md">
                        <img src={tool.icon ? `/storage/${tool.icon}` : '/assets/images/placeholder.png'} alt={tool.name} className="h-12" />
                        <div className="md:space-y-2">
                            <h3 className="text-xl font-semibold md:text-2xl dark:text-gray-900">{tool.name}</h3>
                            <p className="text-sm text-gray-500">{tool.description}</p>
                        </div>
                    </div>
                ))}
            </InfiniteSlider>
        </section>
    );
}
