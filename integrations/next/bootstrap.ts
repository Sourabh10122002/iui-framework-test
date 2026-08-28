/**
 * Next.js bootstrap side-effect — import once per bundle graph (server layout + client providers).
 * Resolves through withIUI() webpack alias `iui-bootstrap` → `.iui-bootstrap-{server|client}.js`,
 * which loads `src/iui/bootstrap.ts` (registerBootstrapState) and compile-first CSS metadata.
 */
import "iui-bootstrap";

export {};
