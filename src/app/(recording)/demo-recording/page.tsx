import ProductDemo from "@/components/demo/ProductDemo";

export default function DemoRecordingPage() {
  return (
    <div className="w-[1920px] h-[1080px] bg-neutral-900 flex items-center justify-center">
      <div className="w-[1600px]">
        <ProductDemo recordingMode />
      </div>
    </div>
  );
}
