// A plain, semantic <table> with the shared visual treatment. Deliberately
// not a data-grid abstraction (no sorting/virtualization built in) - the
// rankings and rally-roster tables that need those behaviors keep their own
// logic and just render inside this shell for a consistent look.
export default function Table({ className = '', children, ...rest }) {
  return (
    <div className="ui-table-scroll">
      <table className={`ui-table ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}
