const interactions = await Bun.file("./interactions.json").json();

const interactionFound: string[] = [];
for (const interaction of interactions) {
  if (
    interaction.drug1 === "Ivermectin" ||
    interaction.drug2 === "Ivermectin"
  ) {
    if (interaction.drug1 === "Ivermectin") {
      interactionFound.push(interaction.drug2);
    } else {
      interactionFound.push(interaction.drug1);
    }
  }
}

console.log(interactionFound.length, JSON.stringify(interactionFound));
