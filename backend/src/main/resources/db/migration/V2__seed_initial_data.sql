-- Flyway Migration V2: Seed Initial Categories and Tags

INSERT INTO categories (name, description, icon) VALUES
('Calculators', 'Scientific, graphing, and financial calculators for math and engineering', 'Calculator'),
('Books', 'Course textbooks, reference books, lab manuals, and novels', 'BookOpen'),
('Lab Equipment', 'Breadboards, multimeters, lab coats, goggles, and microcontroller kits', 'FlaskConical'),
('Chargers', 'Laptop chargers (Type-C, MagSafe, Barrel), phone adapters, and power banks', 'Zap'),
('Other', 'Drafters, drawing boards, umbrella, cameras, sports items and more', 'Package');

INSERT INTO tags (name) VALUES
('Engineering'),
('CSE'),
('ECE'),
('Mechanical'),
('Calculus'),
('Fast Charging'),
('USB-C'),
('Lab Essential'),
('Semester 1'),
('Exam Ready');
