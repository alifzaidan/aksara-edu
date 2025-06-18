import { InfiniteSlider } from '@/components/ui/infinite-slider';

export default function ToolsSection() {
    return (
        <section className="w-fullpx-4 py-8">
            <p className="text-primary border-primary bg-background mx-auto mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                Tools & Framework
            </p>
            <h2 className="mx-auto mb-8 max-w-2xl text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Tools up-to-date yang digunakan
            </h2>
            <InfiniteSlider speedOnHover={20} gap={24} className="p-4">
                <div className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-laravel.svg" alt="Laravel" />
                    <div className="md:space-y-2">
                        <h3 className="text-xl font-semibold md:text-2xl">Laravel</h3>
                        <p className="text-sm text-gray-500">Backend Development</p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-reactjs.svg" alt="React JS" />
                    <div className="md:space-y-2">
                        <h3 className="text-xl font-semibold md:text-2xl">React JS</h3>
                        <p className="text-sm text-gray-500">Frontend Development</p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-vue.svg" alt="Vue" />
                    <div className="md:space-y-2">
                        <h3 className="text-xl font-semibold md:text-2xl">Vue.js</h3>
                        <p className="text-sm text-gray-500">Frontend Development</p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-figma.svg" alt="Figma" />
                    <div className="md:space-y-2">
                        <h3 className="text-xl font-semibold md:text-2xl">Figma</h3>
                        <p className="text-sm text-gray-500">UI/UX Design</p>
                    </div>
                </div>
            </InfiniteSlider>
            <InfiniteSlider speedOnHover={20} gap={24} className="p-4" reverse>
                <div className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-laravel.svg" alt="Laravel" />
                    <div className="md:space-y-2">
                        <h3 className="text-xl font-semibold md:text-2xl">Laravel</h3>
                        <p className="text-sm text-gray-500">Backend Development</p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-reactjs.svg" alt="React JS" />
                    <div className="md:space-y-2">
                        <h3 className="text-xl font-semibold md:text-2xl">React JS</h3>
                        <p className="text-sm text-gray-500">Frontend Development</p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-vue.svg" alt="Vue" />
                    <div className="md:space-y-2">
                        <h3 className="text-xl font-semibold md:text-2xl">Vue.js</h3>
                        <p className="text-sm text-gray-500">Frontend Development</p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 shadow-md">
                    <img src="/assets/images/icon-figma.svg" alt="Figma" />
                    <div className="md:space-y-2">
                        <h3 className="text-xl font-semibold md:text-2xl">Figma</h3>
                        <p className="text-sm text-gray-500">UI/UX Design</p>
                    </div>
                </div>
            </InfiniteSlider>
        </section>
    );
}
