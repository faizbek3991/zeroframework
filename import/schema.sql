CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    release_year INT,
    rating NUMERIC(3, 1),
    poster_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data
INSERT INTO movies (title, description, release_year, rating, poster_url) VALUES
('Inception', 'A thief who steals corporate secrets through dream-sharing technology.', 2010, 8.8, 'https://placehold.co/300x450?text=Inception'),
('Interstellar', 'A team of explorers travel through a wormhole in space to ensure humanity''s survival.', 2014, 8.7, 'https://placehold.co/300x450?text=Interstellar'),
('The Matrix', 'A computer hacker learns about the true nature of reality and his role in the war against its controllers.', 1999, 8.7, 'https://placehold.co/300x450?text=The+Matrix')
ON CONFLICT DO NOTHING;