const { withDangerousMod, withMod, IOSConfig } = require("expo/config-plugins");
const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");

const BG_IMAGE_VIEW_ID = "EXPO-SplashScreenBG";
const CONTAINER_ID = "EXPO-ContainerView";
const BG_IMAGE_NAME = "SplashScreenBGImage";

function sha1(...parts) {
  return createHash("sha1").update(parts.join("-")).digest("hex");
}

function edgeConstraint(childId, parentId, attribute) {
  return {
    $: {
      firstItem: childId,
      firstAttribute: attribute,
      secondItem: parentId,
      secondAttribute: attribute,
      id: sha1(childId, attribute, parentId, attribute),
    },
  };
}

function removeById(arr, id) {
  if (!arr) return;
  const i = arr.findIndex((e) => (e.$?.id ?? e.$?.name) === id);
  if (i !== -1) arr.splice(i, 1);
}

function injectBGImageView(xml) {
  const mainView =
    xml.document.scenes[0].scene[0].objects[0].viewController[0].view[0];
  const w = mainView.rect[0].$.width;
  const h = mainView.rect[0].$.height;

  const bgImageView = {
    $: {
      id: BG_IMAGE_VIEW_ID,
      userLabel: BG_IMAGE_NAME,
      image: BG_IMAGE_NAME,
      contentMode: "scaleAspectFill",
      clipsSubviews: true,
      userInteractionEnabled: false,
      translatesAutoresizingMaskIntoConstraints: false,
    },
    rect: [{ $: { key: "frame", x: 0, y: 0, width: w, height: h } }],
  };

  if (!mainView.subviews) mainView.subviews = [{ imageView: [] }];
  if (!mainView.subviews[0].imageView) mainView.subviews[0].imageView = [];
  const views = mainView.subviews[0].imageView;
  removeById(views, BG_IMAGE_VIEW_ID);
  views.unshift(bgImageView);

  if (!mainView.constraints) mainView.constraints = [{ constraint: [] }];
  if (!mainView.constraints[0].constraint)
    mainView.constraints[0].constraint = [];
  const constraints = mainView.constraints[0].constraint;

  for (const attr of ["top", "leading", "trailing", "bottom"]) {
    const c = edgeConstraint(BG_IMAGE_VIEW_ID, CONTAINER_ID, attr);
    removeById(constraints, c.$.id);
    constraints.push(c);
  }

  if (!xml.document.resources) xml.document.resources = [{}];
  if (!xml.document.resources[0].image) xml.document.resources[0].image = [];
  const images = xml.document.resources[0].image;
  removeById(images, BG_IMAGE_NAME);
  images.unshift({ $: { name: BG_IMAGE_NAME, width: w, height: h } });

  return xml;
}

async function writeImageSet(iosProjectRoot, sourceImage) {
  const imageSetDir = path.join(
    iosProjectRoot,
    "Images.xcassets",
    `${BG_IMAGE_NAME}.imageset`
  );
  await fs.promises.mkdir(imageSetDir, { recursive: true });

  await fs.promises.copyFile(
    sourceImage,
    path.join(imageSetDir, "background-image.png")
  );

  await fs.promises.writeFile(
    path.join(imageSetDir, "Contents.json"),
    JSON.stringify(
      {
        images: [
          {
            filename: "background-image.png",
            idiom: "universal",
            scale: "1x",
          },
          { idiom: "universal", scale: "2x" },
          { idiom: "universal", scale: "3x" },
        ],
        info: { author: "xcode", version: 1 },
      },
      null,
      2
    )
  );
}

const withSplashScreenBG = (config, props) => {
  const bgImageSource =
    props?.image ?? path.resolve(__dirname, "..", "assets", "splash-bg.png");

  config = withMod(config, {
    platform: "ios",
    mod: "splashScreenStoryboard",
    action(config) {
      config.modResults = injectBGImageView(config.modResults);
      return config;
    },
  });

  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosProjectRoot = IOSConfig.Paths.getSourceRoot(
        config.modRequest.projectRoot
      );
      const resolvedImage = path.isAbsolute(bgImageSource)
        ? bgImageSource
        : path.resolve(config.modRequest.projectRoot, bgImageSource);

      await writeImageSet(iosProjectRoot, resolvedImage);
      return config;
    },
  ]);

  return config;
};

module.exports = withSplashScreenBG;
