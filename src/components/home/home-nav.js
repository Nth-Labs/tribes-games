import React from 'react';
import { Link } from 'react-router-dom';
import { GAME_LIBRARY } from '../../game_modules/registry';

const HomeNav = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="p-10 text-3xl">NthLabs' Game Library</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {GAME_LIBRARY.map((game) => (
          <Link key={game.slug} to={`/games/${game.slug}`} className="group">
            <div className="flex h-full flex-col items-center gap-4 rounded-2xl bg-white/80 p-6 text-center shadow transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={game.thumbnail}
                  alt={`${game.title} Thumbnail`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{game.title}</p>
                {game.subtitle && (
                  <p className="mt-1 text-sm text-slate-500">{game.subtitle}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomeNav;
