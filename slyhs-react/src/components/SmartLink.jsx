import { useLocation, useNavigate } from 'react-router-dom';
import { useSmooth } from '../lib/smooth';

/**
 * Link that understands "#section", "/page" and "/page#section".
 * Same-page hashes scroll smoothly (Lenis); other pages route via React Router.
 */
export default function SmartLink({ to, onClick, children, ...rest }) {
  const { scrollTo } = useSmooth();
  const location = useLocation();
  const navigate = useNavigate();

  const isHashOnly = to.startsWith('#');
  const [path, hash] = isHashOnly ? [location.pathname, to] : to.split(/(?=#)/);

  const handleClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (onClick) onClick(e);
    if ((path || '/') === location.pathname && hash) scrollTo(hash);
    else navigate((path || '/') + (hash || ''));
  };

  return <a href={to} onClick={handleClick} {...rest}>{children}</a>;
}
