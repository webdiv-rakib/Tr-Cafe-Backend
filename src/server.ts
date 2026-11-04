import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT;
async function main() {
    try {
        // await prisma.$connect();
        console.log("Connected to the database successfully");
        app.listen(PORT, () => {
            console.log(`Server is running on port:${PORT}`);
        })
    } catch (error) {
        console.log("Error starting the server:", error);
        // await prisma.$disconnect();
        process.exit(1);
    }
};
main();