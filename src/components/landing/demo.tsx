import ProductDemo from "@/components/demo/ProductDemo";

export function Demo() {
  return (
    <section id="demo" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-red-light text-primary-red text-sm font-semibold mb-4">
            See It In Action
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Your AI Advisory Board at Work
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Watch how CEO Sidekick personalizes advice to your specific business context 
            and provides expert guidance across multiple domains.
          </p>
        </div>

        {/* Product Demo */}
        <ProductDemo />
      </div>
    </section>
  );
}
