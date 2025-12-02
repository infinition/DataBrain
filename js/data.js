// --- Données Initiales ---

const generateId = () => Math.random().toString(36).substr(2, 9);

let formations = [
    {
        id: 'f1',
        title: 'Formation Data Scientist',
        isOpen: true,
        modules: [
            {
                id: 'm1',
                title: 'Module 1 : Data Science',
                icon: 'folder',
                isOpen: true,
                chapters: [
                    {
                        id: 'c1',
                        title: 'Introduction',
                        isOpen: true,
                        subChapters: [
                            {
                                id: 'sc1',
                                title: 'Bienvenue',
                                type: 'page',
                                isCompleted: false,
                                isOpen: true,
                                subChapters: [], // Nested sub-chapters
                                blocks: [
                                    { id: 'b1', type: 'text', content: "Bienvenue dans votre Learning Hub. Activez le 'Mode Édition' pour glisser-déposer des fichiers ou structurer votre cours." },
                                    {
                                        id: 'b2',
                                        type: 'quiz',
                                        content: {
                                            questions: [
                                                { question: "Python est-il typé dynamiquement ?", options: ["Oui", "Non"], correct: 0 }
                                            ]
                                        }
                                    },
                                    {
                                        id: 'b3',
                                        type: 'flashcard',
                                        content: [
                                            { question: "Qu'est-ce que Pandas ?", answer: "Une librairie Python pour la manipulation de données." }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
];
