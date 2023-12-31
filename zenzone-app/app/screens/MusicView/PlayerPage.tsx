import { TrackProps } from "@constants/Interfaces";
import { downloadError } from "@constants/errors";
import { requestStoragePermission } from "@constants/permissions";
import { AudioDirectoryPath, DirectoryPath } from "@constants/saveconst";
import { MyText, SafeView } from "@elements/SharedElements";
import { useAudioHelper } from "@helpers/audio-helper";
import useNavHelper from "@hooks/useNavHelper";
import useStyle from "@hooks/useStyle";
import Player from "@screens/Player/Player";
import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Platform,
  ScrollView,
  ToastAndroid,
  View,
} from "react-native";
import RNFS, { DownloadProgressCallbackResult } from "react-native-fs";
import { useSharedValue } from "react-native-reanimated";
import Header from "./Header";

const PlayerPage = (props: any) => {
  const { item }: { item: TrackProps } = props.route.params;
  const { headerShown } = props.route.params;

  const { color } = useStyle();
  const [visibleToast, setvisibleToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const downloadProgress = useSharedValue(0);
  const { handleBack } = useNavHelper();

  const [downloaded, setDownloaded] = useState(false);
  const [paths, setPaths] = useState("");

  useEffect(() => {
    let isMounted = true;
    RNFS.readDir(AudioDirectoryPath)
      .then((files) => {
        if (isMounted) {
          for (let index = 0; index < files.length; index++) {
            const element = files[index];
            if (element.name.substring(0, 8) === item.id) {
              setDownloaded(true);
              setPaths(element.path);
            }
          }
        }
      })
      .catch((err) => {
        console.log(err.message, err.code);
        RNFS.mkdir(DirectoryPath);
        RNFS.mkdir(AudioDirectoryPath);
      });
    return () => {
      isMounted = false;
    };
  }, [item.id]);

  const player = useAudioHelper({
    listSounds: [
      {
        type: "undefined",
        path: paths ? paths : item.url,
        name: item.title,
        item: item,
      },
    ],
  });

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [handleBack]);

  const Toast = ({
    visible,
    message,
  }: {
    visible: boolean;
    message: string;
  }) => {
    if (visible && Platform.OS === "android") {
      ToastAndroid.showWithGravityAndOffset(
        message,
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM,
        25,
        50
      );
      return null;
    }
    return null;
  };

  const path =
    AudioDirectoryPath +
    "/" +
    item.id +
    item.title +
    " - " +
    item.artist +
    ".mp3";

  const downloadOptions = {
    fromUrl: item.url,
    toFile: path,
    progress: (res: DownloadProgressCallbackResult) => {
      downloadProgress.value = res.bytesWritten / res.contentLength;
    },
  };

  const downloadData = async () => {
    Platform.OS === "android" && (await requestStoragePermission());

    const response = RNFS.downloadFile(downloadOptions);
    response.promise
      .then(() => {
        setDownloaded(true);
        setToastMessage("Successfully download for offline use");
        setvisibleToast(true);
      })
      .catch((_) => {
        Alert.alert("Error", downloadError);
      });
  };

  useEffect(() => setvisibleToast(false), [visibleToast]);

  return (
    <SafeView>
      <Header
        backHandler={handleBack}
        {...{ item }}
        {...{ downloadData }}
        {...{ headerShown }}
        {...{ downloaded }}
        currentTime={player.currentTimeString}
        downloadProgress={downloadProgress.value}
      />

      <Toast visible={visibleToast} message={toastMessage} />
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          height: "80%",
        }}
      >
        <View
          style={{
            width: "80%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ScrollView
            style={{
              height: 200,
            }}
          >
            {/* {item.pose_description} */}

            {/* split from . and create a new line */}

            {item.pose_description ? (
              item.pose_description.split(".").map((item, index) => {
                return (
                  <MyText key={index}>
                    {item}
                    {"\n"}
                  </MyText>
                );
              })
            ) : (
              <MyText>{item.title}</MyText>
            )}
          </ScrollView>
          <MyText color={color.grey} style={{ marginTop: 10 }}>
            {item.sanskrit_name ? item.sanskrit_name : "Meditation"}
          </MyText>
        </View>
        <Player player={player} item={item} />
      </View>
    </SafeView>
  );
};

export default PlayerPage;
