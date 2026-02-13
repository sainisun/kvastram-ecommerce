
export default function AboutPage() {
    return (
        <div className="bg-white min-h-screen pt-20 pb-20">
            <div className="max-w-4xl mx-auto px-6 space-y-20">

                {/* Header */}
                <div className="text-center space-y-6">
                    <span className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">Our Story</span>
                    <h1 className="text-5xl md:text-6xl font-serif text-stone-900 leading-tight">
                        Weaving the World <br /> Together
                    </h1>
                </div>

                {/* Content Block 1 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 text-lg text-stone-600 font-light leading-relaxed">
                        <p>
                            Kvastram began with a simple question: Why must luxury define itself by exclusion?
                            We believe true luxury lies in the hands that create it—the master weaver in Varanasi,
                            the leather artisan in Florence, the silver smith in Jaipur.
                        </p>
                        <p>
                            Our journey is one of connection. We travel to the source, meeting makers in their homes
                            and workshops, building relationships that go beyond commerce.
                        </p>
                    </div>
                    <div className="aspect-[4/5] bg-stone-200 relative">
                        {/* Placeholder for About Image */}
                        <div className="absolute inset-0 bg-stone-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-stone-400 italic"> Artisan at Work</div>
                    </div>
                </div>

                {/* Philosophy */}
                <div className="bg-stone-50 p-12 text-center space-y-6">
                    <h2 className="text-3xl font-serif text-stone-900">Slow Fashion, Deep Roots</h2>
                    <p className="max-w-2xl mx-auto text-stone-600 leading-relaxed">
                        In a world of fast fashion, we choose the path of patience.
                        Each Kvastram piece takes weeks, sometimes months, to create.
                        We produce in small batches to ensure quality and minimize waste.
                    </p>
                </div>
            </div>
        </div>
    );
}
