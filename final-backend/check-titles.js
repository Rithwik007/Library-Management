const mongoose = require('mongoose');
require('dotenv').config();

async function checkBooks() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Book = mongoose.model('Book', new mongoose.Schema({ title: String }));
        const books = await Book.find().limit(5);
        console.log('Book Titles:', books.map(b => b.title));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkBooks();
