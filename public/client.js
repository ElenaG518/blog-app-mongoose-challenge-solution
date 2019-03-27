var shoppingItemTemplate =
  '<li class="js-shopping-item">' +
  '<p><span class="shopping-item js-shopping-item-name"></span></p>' +
  '<div class="shopping-item-controls">' +
  '<button class="js-shopping-item-toggle">' +
  '<span class="button-label">check</span>' +
  "</button>" +
  '<button class="js-shopping-item-delete">' +
  '<span class="button-label">delete</span>' +
  "</button>" +
  "</div>" +
  "</li>";

var recipeTemplate =
  '<div class="recipe js-recipe">' +
  '<h3 class="js-recipe-name"><h3>' +
  "<hr>" +
  '<ul class="js-recipe-ingredients">' +
  "</ul>" +
  '<div class="recipe-controls">' +
  '<button class="js-recipe-delete">' +
  '<span class="button-label">delete</span>' +
  "</button>" +
  "</div>" +
  "</div>";

var serverBase = "//localhost:8080/";
var RECIPES_URL = serverBase + "recipes";
var SHOPPING_LIST_URL = serverBase + "shopping-list";

function getAndDisplayRecipes() {
  console.log("Retrieving recipes");
  $.getJSON(RECIPES_URL, function(recipes) {
    console.log("Rendering recipes");
    var recipesElement = recipes.map(function(recipe) {
      var element = $(recipeTemplate);
      element.attr("id", recipe.id);
      element.find(".js-recipe-name").text(recipe.name);
      recipe.ingredients.forEach(function(ingredient) {
        element
          .find(".js-recipe-ingredients")
          .append("<li>" + ingredient + "</li>");
      });
      return element;
    });
    $(".js-recipes").html(recipesElement);
  });
}

function getAndDisplayShoppingList() {
  console.log("Retrieving shopping list");
  $.getJSON(SHOPPING_LIST_URL, function(items) {
    console.log("Rendering shopping list");
    var itemElements = items.map(function(item) {
      var element = $(shoppingItemTemplate);
      element.attr("id", item.id);
      var itemName = element.find(".js-shopping-item-name");
      itemName.text(item.name);
      element.attr("data-checked", item.checked);
      if (item.checked) {
        itemName.addClass("shopping-item__checked");
      }
      return element;
    });
    $(".js-shopping-list").html(itemElements);
  });
}

function addRecipe(recipe) {
  console.log("Adding recipe: " + recipe);
  $.ajax({
    method: "POST",
    url: RECIPES_URL,
    data: JSON.stringify(recipe),
    success: function(data) {
      getAndDisplayRecipes();
    },
    dataType: "json",
    contentType: "application/json"
  });
}

function addShoppingItem(item) {
  console.log("Adding shopping item: " + item);
  $.ajax({
    method: "POST",
    url: SHOPPING_LIST_URL,
    data: JSON.stringify(item),
    success: function(data) {
      getAndDisplayShoppingList();
    },
    dataType: "json",
    contentType: "application/json"
  });
}

function deleteRecipe(recipeId) {
  console.log("Deleting recipe `" + recipeId + "`");
  $.ajax({
    url: RECIPES_URL + "/" + recipeId,
    method: "DELETE",
    success: getAndDisplayRecipes
  });
}

function deleteShoppingItem(itemId) {
  console.log("Deleting shopping item `" + itemId + "`");
  $.ajax({
    url: SHOPPING_LIST_URL + "/" + itemId,
    method: "DELETE",
    success: getAndDisplayShoppingList
  });
}

function updateRecipe(recipe) {
  console.log("Updating recipe `" + recipe.id + "`");
  $.ajax({
    url: RECIPES_URL + "/" + recipe.id,
    method: "PUT",
    data: recipe,
    success: function(data) {
      getAndDisplayRecipes();
    }
  });
}

function updateShoppingListitem(item) {
  console.log("Updating shopping list item `" + item.id + "`");
  $.ajax({
    url: SHOPPING_LIST_URL + "/" + item.id,
    method: "PUT",
    data: JSON.stringify(item),
    success: function(data) {
      getAndDisplayShoppingList();
    },
    dataType: "json",
    contentType: "application/json"
  });
}

function handleRecipeAdd() {
  $("#js-recipe-form").submit(function(e) {
    e.preventDefault();
    var ingredients = $(e.currentTarget)
      .find("#ingredients-list")
      .val()
      .split(",")
      .map(function(ingredient) {
        return ingredient.trim();
      });
    addRecipe({
      name: $(e.currentTarget)
        .find("#recipe-name")
        .val(),
      ingredients: ingredients
    });
  });
}

function handleShoppingListAdd() {
  $("#js-shopping-list-form").submit(function(e) {
    e.preventDefault();
    addShoppingItem({
      name: $(e.currentTarget)
        .find("#js-new-item")
        .val(),
      checked: false
    });
  });
}

function handleRecipeDelete() {
  $(".js-recipes").on("click", ".js-recipe-delete", function(e) {
    e.preventDefault();
    deleteRecipe(
      $(e.currentTarget)
        .closest(".js-recipe")
        .attr("id")
    );
  });
}

function handleShoppingListDelete() {
  $(".js-shopping-list").on("click", ".js-shopping-item-delete", function(e) {
    e.preventDefault();
    deleteShoppingItem(
      $(e.currentTarget)
        .closest(".js-shopping-item")
        .attr("id")
    );
  });
}

function handleShoppingCheckedToggle() {
  $(".js-shopping-list").on("click", ".js-shopping-item-toggle", function(e) {
    e.preventDefault();
    var element = $(e.currentTarget).closest(".js-shopping-item");
    var item = {
      id: element.attr("id"),
      checked: !JSON.parse(element.attr("data-checked")),
      name: element.find(".js-shopping-item-name").text()
    };
    updateShoppingListitem(item);
  });
}

$(function() {
  getAndDisplayShoppingList();
  handleShoppingListAdd();
  handleShoppingListDelete();
  handleShoppingCheckedToggle();

  getAndDisplayRecipes();
  handleRecipeAdd();
  handleRecipeDelete();
});
