import emptyStateImg from "@/assets/empty-state.png";

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-32">
    <img src={emptyStateImg} alt="Empty state" className="w-[200px] h-auto" />
    <p className="text-muted-foreground text-sm mt-4 text-center">
      It looks like you haven't created your view yet.
      <br />
      Please make a selection to continue.
    </p>
  </div>
);

export default EmptyState;