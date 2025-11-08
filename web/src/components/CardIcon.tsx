import { useEffect, useState } from 'react';
import { getCardImageUrl } from '../api/pokemonTcg';

interface Props {
  name: string;
}

export default function CardIcon({ name }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const result = await getCardImageUrl(name);
      if (alive) {
        setUrl(result);
      }
    })();
    return () => {
      alive = false;
    };
  }, [name]);

  return (
    <div className="card-icon">
      {url ? (
        <img src={url} alt={name} loading="lazy" />
      ) : (
        <div className="card-placeholder">{name}</div>
      )}
    </div>
  );
}